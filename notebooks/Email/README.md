# Email spam classification notebooks

## Run locally

Use Python 3.13 and the project virtual environment. From the repository root:

```powershell
.\.venv\Scripts\python.exe -m pip install --no-compile -r notebooks/requirements-email.txt
```

Open `email_spam_classification.ipynb` in PyCharm, select `.venv` as the kernel, then choose **Restart Kernel and Run All**. The notebook locates the project root from the working directory. No database, running backend, ingestion job, or cleaning notebook is required. All preprocessing and prediction helpers are defined inside the notebook.

`../messages_cleaning.ipynb` is a separate, partial upstream cleaning notebook. The classifier directly reads the committed cleaned email CSV; rerunning ingestion is unnecessary.

## Data and preprocessing

Training source: `../../data/processed/messages/spamassassin_emails_cleaned.csv` (4,518 rows). The CSV contains message_id, file_name, source_folder, sender, receiver, subject, date, body, label, source, message_type and text. Only **subject and body** enter the model. Labels are legitimate=0 and spam=1. Metadata such as source_folder can reveal labels and is excluded. The undocumented text column is rebuilt from subject and body.

Notebook preprocessing applies Unicode NFKC normalization, collapses whitespace, and concatenates subject and body. Vectorizers lowercase text. Punctuation, numbers and stop words are retained by default; one candidate explicitly tests English stop-word removal. Stemming and lemmatization are not mandatory steps and are not applied. Prediction inputs must contain MIME-decoded plain-text subject/body; raw .eml parsing, attachments and HTML-to-text conversion are not implemented here.

Before splitting, content is deduplicated by case-folded normalized body (subject fallback for empty bodies). Groups with contradictory labels are removed entirely. Current data removes 3 conflicting-label rows and 161 other duplicate rows, leaving **4,354** examples. This catches normalized exact duplicates, not every near-duplicate campaign. Short identical bodies may conservatively collapse distinct emails.

## Training, selection and evaluation partitions

- Fixed random seed: **42**.
- Stratified split: **3,483 training rows (80%)**, **871 benchmark rows (20%)**.
- **Five-fold stratified cross-validation** on training rows only.
- Nine configurations are compared (45 fits), selected by mean **spam F1**. Precision, recall, accuracy, fold standard deviation and fit time are also shown.
- Each fold fits its own vocabulary and TF-IDF document frequencies inside a Pipeline. Temporary caching reuses identical fold transformations without sharing held-out information.
- The winner is refitted on the 3,483 training examples. The 871-row benchmark is never fitted.
- The benchmark has already been inspected across notebook revisions. It is a reused development benchmark, not a fresh independent estimate of inbox performance.

## Features and algorithms

| Features | Classifier | Configurations |
|---|---|---|
| Word/bigram bag-of-words counts, up to 30,000 tokens | Multinomial Naive Bayes | alpha=1 |
| Word/bigram TF-IDF, up to 30,000 tokens | Complement Naive Bayes | alpha=0.1 or 0.5 |
| Word/bigram TF-IDF, up to 30,000 tokens | Logistic regression | C=1 or 10 |
| Word/bigram TF-IDF, up to 30,000 tokens | Linear SVM | C=1, with/without English stop words |
| Character TF-IDF, 3-5 character fragments, up to 40,000 tokens | Linear SVM | C=1 |
| Word/bigram TF-IDF, up to 10,000 tokens | Random Forest | 150 trees, min_samples_leaf=2 |

All vectorizers require a token in at least two training documents. TF-IDF uses sublinear term frequency. Complement NB adjusts the probabilistic text baseline using complementary-class counts. Logistic regression and SVM learn regularized linear boundaries. Character fragments can capture spelling variants; Random Forest is a bounded nonlinear baseline. This is not an exhaustive or equally sized hyperparameter search for every family.

Word embeddings are documented as a possible future experiment; no pretrained embedding model is downloaded or used. Their model provenance, language coverage and performance would need separate validation.

### How character TF-IDF and LinearSVC work together

**Character TF-IDF** converts an email into numerical features using overlapping fragments of 3-5 characters. For example, `prize` includes fragments such as `pri`, `riz`, `ize`, and `prize`. The notebook uses `char_wb`, which extracts fragments within words and pads word boundaries with spaces. TF measures how often a fragment appears in an email (with logarithmic scaling here); IDF gives more weight to fragments that occur in fewer training emails. The resulting vectors are normalized. Shared fragments can help recognize spelling variants, although they do not guarantee detection of obfuscated spam.

**LinearSVC** is a linear support vector classifier. During training, it learns a weight for each feature and a bias, balancing a wide separation between the classes against penalties for classification errors. For a new email, it combines the TF-IDF features into a score: `score = weights · features + bias`. In this notebook, a positive score predicts spam and a negative score predicts legitimate email. The score is a decision margin, not a probability or confidence percentage. The parameter `C=1` controls the trade-off between regularization and error penalties.

Together, character TF-IDF represents the email's text patterns, and LinearSVC learns which combinations distinguish spam from legitimate messages. New emails use the vocabulary and weights already learned from training; prediction does not retrain either step.

## What the results mean

The selected model in the verified run is **character TF-IDF + LinearSVC**. On the reused benchmark:

- Accuracy: **98.39%**; spam precision: **97.58%**; recall: **98.17%**; F1: **97.87%**.
- 535 legitimate emails correct, 8 false spam alarms, 6 missed spam, 322 spam correct.

The additional `../../data/evaluation/emails/synthetic_emails.csv` has the same 12 columns and 40 newly authored English examples (20 per class). It is loaded **after training**, without changing the original split, and is never used for selection or fitting. Checks reject schema mismatch, empty messages, duplicate IDs/content and overlap with the source corpus.

The synthetic check scored **60% accuracy**: all 20 spam examples were detected, but **16 of 20 legitimate messages were incorrectly flagged**. This exposes a major generalization limitation. Synthetic writing, balanced classes and authored labels are not representative of a real inbox. Neither result justifies automatic email deletion/blocking. A separate, manually labeled recent inbox sample is needed; the notebook's optional external evaluation cell supports this.

Plots include count/normalized benchmark confusion matrices, a precision-recall curve, synthetic confusion matrix and metric bars, and six full input-email cards with actual label, predicted label and score. Cards prioritize up to two errors, then examples from each class. The full prediction table remains available as `synthetic_predictions`.

Confusion matrix rows are actual classes; columns are predictions. False positives are legitimate emails classified as spam. Spam precision measures how many flagged emails are spam; recall measures how many spam emails are detected. F1 balances these. Average precision measures ranking across thresholds, not accuracy at the default threshold.

## Model export and team handoff

Section 8 defaults to `SAVE_ARTIFACTS = True`. It writes ignored local artifacts:

```text
ml/artifacts/email_spam/pipeline.joblib
ml/artifacts/email_spam/metadata.json
```

The manifest includes artifact/preprocessing versions, exact runtime library versions, label mapping, model checksum, dataset fingerprint and benchmark metrics. The content-derived model version identifies the serialized pipeline. Export still fits only training rows; no synthetic/full-data refit occurs. Set SAVE_ARTIFACTS=False to skip export. Export replaces the previous files.

The backend integration is left to the team. No email API, risk policy or model-loading service is implemented by this notebook. A future consumer should use matching runtime dependencies, apply the notebook's `email_text` preprocessing, validate the manifest and load only trusted joblib artifacts. A checksum detects a file mismatch, not authenticity.

For the selected LinearSVC, the model score is a signed **decision margin**, not a probability percentage. The team must define how predictions map to application risk rules; the notebook does not assign risk points.

## Verification

Run the existing repository tests from the project root:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Use Restart Kernel and Run All to reproduce training, evaluation, export and plots independently of the backend.

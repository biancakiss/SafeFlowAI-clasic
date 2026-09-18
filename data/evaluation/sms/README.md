# Synthetic SMS evaluation set

`synthetic_sms.csv` contains 40 newly authored English SMS examples: 20 legitimate and 20 spam. The messages cover personal conversations, appointments, transactional alerts, prizes, phishing, fake delivery notices, financial scams, promotions and extortion. All URLs use the reserved `.example` domain, and the messages contain no real personal information.

The dataset is kept separate from training. Labels are mapped from `legitimate/spam` to the model's `ham/spam` names. It has no empty bodies, duplicate IDs, duplicate bodies, or exact message overlap with either `../../processed/messages/uci_messages_cleaned.csv` or `../../processed/messages/sms_training_augmentation.csv`.

The first evaluation used `sms-tfidf-logreg-v1` with its stored threshold of `0.5`. Its errors then informed the general categories included in the v2 training augmentation and engineered features. Consequently, this dataset is useful for before/after regression testing but must no longer be described as an untouched or unbiased final benchmark for v2. A fresh independently authored or collected holdout is required for that purpose.

## Results

Evaluation run: 2026-09-18. The current artifact is `sms-tfidf-patterns-v2`, which selected probabilistic SGD and a threshold of `0.35` using a separate validation partition of the original corpus.

| Metric | v1 baseline | v2 current |
| --- | ---: | ---: |
| Examples | 40 | 40 |
| Accuracy | 67.50% | 85.00% |
| Spam precision | 73.33% | 79.17% |
| Spam recall | 55.00% | 95.00% |
| Spam F1 | 62.86% | 86.36% |
| Ham precision | 64.00% | 93.75% |
| Ham recall | 80.00% | 75.00% |
| Ham F1 | 71.11% | 83.33% |

Confusion matrix, with true labels as rows and predicted labels as columns:

| True / predicted | Ham | Spam |
| --- | ---: | ---: |
| Ham | 15 | 5 |
| Spam | 1 | 19 |

V2 reduced the errors from 13 to 6. Legitimate messages `SYNTH-SMS-002`, `005`, `006`, `008`, and `019` were classified as spam. Spam message `SYNTH-SMS-031` was classified as ham, with a spam probability of `0.348384`, just below the `0.35` threshold. Compared with v1, v2 correctly detects 19 rather than 11 of the 20 spam examples, at the cost of one additional false positive.

On the untouched 774-row test partition from the original UCI corpus, v2 achieved 98.45% accuracy, 91.18% spam precision, 96.88% spam recall, and 93.94% spam F1. That test partition excludes the 40 augmentation messages.

## Reproduce the evaluation

From the project root, run:

```powershell
.\.venv\Scripts\python.exe .\data\evaluation\sms\evaluate.py
```

The script loads the saved pipeline and metadata, checks exact overlap with both training sources, applies the stored threshold, and prints the classification report, confusion matrix, and every misclassification.

## Interpretation

This small, balanced, synthetic dataset is a functional regression/challenge set, not an estimate of real-world SMS traffic. Its 50/50 class balance and authored language differ from production data. Because its v1 results influenced v2 development, the improved v2 score is directional evidence rather than a clean generalization estimate. Deployment decisions should use a larger, independently labeled and representative recent SMS sample, with special attention to spam recall and the cost of false positives.

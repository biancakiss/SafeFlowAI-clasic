# Synthetic email evaluation set

`synthetic_emails.csv` contains 40 newly authored English examples: 20 legitimate and 20 spam. It has the same column names and order as `spamassassin_emails_cleaned.csv`. IDs are prefixed with SYNTH; all addresses and links use reserved example domains. These are invented emails, not collected inbox messages. Spam labels include unsolicited promotions, scams, phishing and extortion; legitimate examples include opt-in promotions and account notices. Labels reflect the authored scenario, which cannot always be inferred confidently from text alone.

The dataset was authored before inspecting its predictions. It is used only after the existing training, cross-validation and corpus benchmark in `../../../notebooks/Email/email_spam_classification.ipynb`. It must not be concatenated with the training data or used to select models or thresholds. Only subject and body are features; labels and metadata never enter the classifier.

This small, balanced, synthetic set is a functional/challenge check, not an independent estimate of real-inbox accuracy. Its language, class balance and writing style are not representative of a real mailbox. Once results are reviewed, do not tune against it and continue calling it a fresh final test. Obtain a separately labeled recent inbox sample for deployment assessment.

The notebook checks schema, labels, IDs, empty text, duplicate content and overlap with the source corpus. It prints metrics and row-level predictions, and plots a confusion matrix, metrics and six example email cards (errors prioritized, then deterministic examples from each class). Displaying results is safe for this synthetic set; review privacy before substituting personal emails.

# Predicting Fraud in Financial Payment Services

This package contains a reproducible tabular fraud classifier for payment transactions. It uses a deterministic synthetic dataset because the repository does not contain labeled fraud outcomes. The workflow compares balanced logistic regression with a balanced random forest, selects the model with the strongest fraud F1 score, exports a `joblib` pipeline and writes a metadata manifest.

## Files

- `train.py`: generates data, trains/evaluates candidate models and exports artifacts.
- `predict.py`: loads the artifact and predicts one transaction.
- `fraud_payment.ipynb`: notebook version of the complete exploratory and modeling workflow.
- `..\..\ml\artifacts\transactions\`: serialized pipeline and metadata produced by `train.py`.

## Run

```powershell
python -m pip install -r requirements.txt
python train.py
python predict.py '{"amount":4500,"hour":2,"is_new_beneficiary":1,"is_international":1,"velocity_24h":8,"account_age_days":30,"currency":"AUD","payment_channel":"international_transfer","beneficiary_country":"NG"}'
```

The predictor requires the six numeric/binary fields and three categorical fields shown in the command. A fraud probability is a model score, not a final payment decision; production use requires a separately approved risk policy, monitoring and human/operational review.

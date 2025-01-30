import pickle

import pandas as pd
from sklearn.model_selection import train_test_split
import xgboost as xgb
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.neighbors import KNeighborsClassifier
import numpy as np
import json

# Load the dataset 
file_path = 'src/coffee 4.csv'  # file path to the code
columns = ["datetime", "coffee_name"]  # Columns that we only need
df = pd.read_csv(file_path, usecols=columns) # Pull the data file with the only chosen columns

# Step 1: Parse the 'datetime' column in the given format
df['datetime'] = pd.to_datetime(df['datetime'], format='%m/%d/%y %H:%M')

# Step 2: Extract time-related features
df['hour_of_day'] = df['datetime'].dt.hour

# Step 3: Aggregate sales data by hour and coffee_name
sales_per_hour = df.groupby(['hour_of_day', 'coffee_name']).size().reset_index(name='sales')

# Step 4: Create a pivot table where each row represents an hour, and columns are coffee types
pivot_sales = sales_per_hour.pivot_table(index='hour_of_day', columns='coffee_name', values='sales', fill_value=0)

# Step 5: Define the target variable
y = pivot_sales.idxmax(axis=1)  # Target is the coffee type with the highest sales per hour

# Step 6: Encode coffee names into numeric labels using LabelEncoder
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

# Step 7: Prepare the features (pivot table values)
X = pivot_sales.reset_index(drop=True)

# Step 8: Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=1000)

# Normalize features for KNN
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Step 9a: Train the XGBoost classifier
xgb_model = xgb.XGBClassifier(
    objective='multi:softmax',
    num_class=len(label_encoder.classes_),
    n_estimators=1000,
    learning_rate=0.1,
    max_depth=12,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=100,
    early_stopping_rounds=10
)

xgb_model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=0)

# Step 9b: Train the KNN classifier
knn_model = KNeighborsClassifier(n_neighbors=12)
knn_model.fit(X_train_scaled, y_train)

# Step 10: Evaluate both models
xgb_pred = xgb_model.predict(X_test)
knn_pred = knn_model.predict(X_test_scaled)

xgb_accuracy = accuracy_score(y_test, xgb_pred)
knn_accuracy = accuracy_score(y_test, knn_pred)

# Combine predictions using majority voting
combined_pred = np.array([np.bincount([x, k]).argmax() for x, k in zip(xgb_pred, knn_pred)])
combined_accuracy = accuracy_score(y_test, combined_pred)

#print(f"XGBoost Accuracy: {xgb_accuracy:.2f} \n")
#print(f"KNN Accuracy: {knn_accuracy:.2f} \n")
#print(f"Combined Accuracy: {combined_accuracy:.2f}")


# Step 11: Find the top 3 selling coffees per hour
top_3_coffees = sales_per_hour.groupby('hour_of_day').apply(lambda x: x.nlargest(3, 'sales')).reset_index(drop=True)
#print("Top 3 selling coffees per hour:")
#print(top_3_coffees)

top_3_coffees_json = top_3_coffees.to_dict(orient='records')
print(json.dumps(top_3_coffees_json))

pickle.dump(xgb_model, open('xgb_model.pkl', 'wb'))
pickle.dump(knn_model, open('knn_model.pkl', 'wb'))

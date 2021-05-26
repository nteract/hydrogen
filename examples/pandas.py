import pandas as pd

pd.options.display.html.table_schema = True
pd.options.display.max_rows = None

iris_url = "https://archive.ics.uci.edu/ml/machine-learning-databases/iris/iris.data"

df1 = pd.read_csv(iris_url)

df1

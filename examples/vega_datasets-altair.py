# on Windows: open the shell as admin then: `pip install vega_datasets altair`
# on Unix: `sudo pip install vega_datasets altair`
# You might need to reload Atom after installation of dependencies if they are not found

import altair as alt
from vega_datasets import data

iris = data.iris()

alt.Chart(iris).mark_point().encode(
x='petalLength',
y='petalWidth',
color='species'
)

from altair import Chart

cars = data.cars()
spec = Chart(cars).mark_point().encode(
x='Horsepower',
y='Miles_per_Gallon',
color='Origin',
)

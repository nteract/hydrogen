# Examples

This is a collection of rich examples supported by Hydrogen.
Please share your favorite snippets with us and add them to this page.

## Interactive plots using [Plotly](https://plot.ly/api/)

{% codetabs name="Python", type="py" -%}
from plotly import offline
offline.init_notebook_mode()

offline.iplot([{"y": [1, 2, 1]}])
{%- language name="Python using matplotlib", type="py" -%}
import numpy as np
import matplotlib.pyplot as plt
from plotly import offline as py
py.init_notebook_mode()

t = np.linspace(0, 20, 500)
plt.plot(t, np.sin(t))

py.iplot_mpl(plt.gcf())
{%- language name="R", type="r" -%}
library(IRdisplay)

data <- list(list(x=c(1999, 2000, 2001, 2002), y=c(10, 15, 13, 17), type='scatter'))
figure <- list(data=data)

mimebundle <- list('application/vnd.plotly.v1+json'=figure)
IRdisplay::publish_mimebundle(mimebundle)
{%- endcodetabs %}

## Interactive plots using Matplotlib

Interactive plots via PyQt/Pyside (creates separate window).

{% codetabs name="Python", type="py" -%}
import matplotlib
matplotlib.use('Qt5Agg')
# This should be done before `import matplotlib.pyplot`
# 'Qt4Agg' for PyQt4 or PySide, 'Qt5Agg' for PyQt5
import matplotlib.pyplot as plt
import numpy as np

t = np.linspace(0, 20, 500)
plt.plot(t, np.sin(t))
plt.show()
{%- endcodetabs %}

## Interactive JSON Objects

{% codetabs name="Python", type="py" -%}
from IPython.display import JSON

data = {"foo": {"bar": "baz"}, "a": 1}
JSON(data)
{%- endcodetabs %}

## Static plots

With support for `svg`, `png`, `jpeg` and `gif`

{% codetabs name="Python using matplotlib", type="py" -%}
import matplotlib.pyplot as plt
import numpy as np

%matplotlib inline
%config InlineBackend.figure_format = 'svg'
t = np.linspace(0, 20, 500)

plt.plot(t, np.sin(t))
plt.show()
{%- language name="Python using altair < v1.3", type="py" -%}
from IPython.display import display
from altair import Chart, load_dataset
def vegify(spec):
    display({
        'application/vnd.vegalite.v1+json': spec.to_dict()
    }, raw=True)

cars = load_dataset('cars')
spec = Chart(cars).mark_point().encode(
    x='Horsepower',
    y='Miles_per_Gallon',
    color='Origin',
)

vegify(spec)
{%- language name="Python using altair v1.3+", type="py" -%}
from altair import Chart, load_dataset, enable_mime_rendering
enable_mime_rendering()

cars = load_dataset('cars')
spec = Chart(cars).mark_point().encode(
    x='Horsepower',
    y='Miles_per_Gallon',
    color='Origin',
)
spec
{%- endcodetabs %}

## LaTeX

{% codetabs name="Python using sympy", type="py" -%}
import sympy as sp
sp.init_printing(use_latex='mathjax')

x, y, z = sp.symbols('x y z')
f = sp.sin(x * y) + sp.cos(y * z)
sp.integrate(f, x)
{%- language name="Python using Math", type="py" -%}
from IPython.display import Math

Math(r'i\hbar \frac{dA}{dt}~=~[A(t),H(t)]+i\hbar \frac{\partial A}{\partial t}.')
{%- language name="Python using Latex", type="py" -%}
from IPython.display import Latex
Latex('''The mass-energy equivalence is described by the famous equation

$$E=mc^2$$

discovered in 1905 by Albert Einstein.
In natural units ($c$ = 1), the formula expresses the identity

\\begin{equation}
E=m
\\end{equation}''')
{%- endcodetabs %}

## Data frames

{% codetabs name="Python using pandas", type="py" -%}
import numpy as np
import pandas as pd

df = pd.DataFrame({'A': 1.,
                   'B': pd.Timestamp('20130102'),
                   'C': pd.Series(1, index=list(range(4)), dtype='float32'),
                   'D': np.array([3] * 4, dtype='int32'),
                   'E': pd.Categorical(["test", "train", "test", "train"]),
                   'F': 'foo'})

df
{%- language name="Python using numpy", type="py" -%}
import numpy as np

t = np.linspace(0, 20, 500)
t
{%- endcodetabs %}

## Images

{% codetabs name="Python", type="py" -%}
from IPython.display import Image
Image('http://jakevdp.github.com/figures/xkcd_version.png')
{%- endcodetabs %}


## HTML

{% codetabs name="Python", type="py" -%}
from IPython.display import HTML
HTML("<iframe src='https://nteract.io/' width='900' height='490'></iframe>")
{%- endcodetabs %}

## Plain Text

{% codetabs name="Python", type="py" -%}
print("Hello World!")
{%- language name="JavaScript", type="js" -%}
console.log("Hello World!");
{%- endcodetabs %}

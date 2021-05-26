# on Windows: open the shell as admin then: `pip install plotly nbformat`
# on Unix: `sudo pip install plotly nbformat`
# You might need to reload Atom after installation of dependencies if they are not found

from plotly import offline
offline.init_notebook_mode()

offline.iplot([{"y": [1, 2, 1]}])

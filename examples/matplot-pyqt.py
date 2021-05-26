# on Windows: open the shell as admin then: `pip install pyqt5 matplotlib numpy`
# on Unix: `sudo pip install pyqt5 matplotlib numpy`
# You might need to reload Atom after installation of dependencies if they are not found

import matplotlib
matplotlib.use('Qt5Agg')

import matplotlib.pyplot as plt
import numpy as np

t = np.linspace(0, 20, 500)
plt.plot(t, np.sin(t))

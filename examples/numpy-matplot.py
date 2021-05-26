# on Windows: open the shell as admin then: `pip install matplotlib numpy nbformat`
# on Unix: `sudo pip install matplotlib numpy nbformat`
# You might need to reload Atom after installation of dependencies if they are not found

import numpy as np
import matplotlib.pyplot as plt

t = np.linspace(0, 20, 500)
plt.plot(t, np.sin(t))

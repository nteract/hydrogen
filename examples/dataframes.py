# on Windows: open the shell as admin then: `pip install numpy pandas`
# on Unix: `sudo pip install numpy pandas`
# You might need to reload Atom after installation of dependencies if they are not found

import numpy as np
import pandas as pd

df = pd.DataFrame({
    'A': 1.,
    'B': pd.Timestamp('20130102'),
    'C': pd.Series(1, index=list(range(4)), dtype='float32'),
    'D': np.array([3] * 4, dtype='int32'),
    'E': pd.Categorical(["test", "train", "test", "train"]),
    'F': 'foo'
})

df

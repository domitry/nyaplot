# Bionya

Nyaplot extension library for Biology

![Bionya](https://dl.dropboxusercontent.com/u/47978121/gsoc/bionya.png)

## Demo

[IRuby notebook](http://nbviewer.ipython.org/github/domitry/nyaplot/blob/master/examples/notebook/Bionya.ipynb)

## How to use
0. Prepare notebook
```ruby
require 'nyaplot'
require 'bionya'
Nyaplot.init_iruby
```

1. Prepare DataFrame from your own data
```ruby
df = Nyaplot::DataFrame.new(some_your_data)
```

2. Generate an instance of Nyaplot::CircularPlot and add some diagrams
```ruby
plot2 = Nyaplot::CircularPlot.new(df, :name, :df)
arc = plot2.add(1, :arc, :axis, :val)
labels.text_size("0.3em")
```

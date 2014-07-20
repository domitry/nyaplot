# Nyaplot
![alt text](https://dl.dropboxusercontent.com/u/47978121/gsoc/nyaoplot_top.png)

Nyaplot is an interactive plots generator for Ruby users. Its goal is to make it easy to create interactive plots in Ruby and still allows fast prototyping, customizability, and the integration with other scientific gems.

Nyaplot is a compound word from 'Nya' and 'plot.' The word 'Nya' comes from a onomatopoeia of cat's meow in Japanese.

This software has been developed as a product in Google Summer of Code 2014 (GSoC2014). Visit a website of [SciRuby project](http://sciruby.com/blog/) or [mailing list](https://groups.google.com/forum/#!forum/sciruby-dev) to see the progress of this project.

## Demo

+ [Tutorial1: Gettig Started with Nyaplot](http://nbviewer.ipython.org/github/domitry/Nyaplot/blob/master/examples/notebook/Introduction.ipynb)
+ [Tutorial2: Interaction with DataFrame](http://nbviewer.ipython.org/github/domitry/Nyaplot/blob/master/examples/notebook/Interaction_with_DataFrame.ipynb)
+ [Tutorial3: Creating 3D plots with Nyaplot3D](http://nbviewer.ipython.org/github/domitry/Nyaplot/blob/master/examples/notebook/3DPlot.ipynb)
+ [Tutorial4: Temporary example](http://nbviewer.ipython.org/github/domitry/nyaplot-example/blob/master/line.ipynb)

Those demos are created on IRuby and published on [nbviewer](http://nbviewer.ipython.org/).

## Extensions

Nyaplot has an extension system to make it easy to add more normal and different types of diagrams.
Libraries shown below are already bundled with this gem and you can use them by adding 'require'.

Each extension consists of its back-end written in JavaScript and a small Ruby wrapper for it. 

### Nyaplot3D

Nyaplot3D enables us to create interactive 3D charts with Ruby.
Its back-end library is [Elegans](https://github.com/domitry/elegans), a 3D plots generator written in JavaScript.
Here is an example, the Lorenz curve generated from a solution by the Euler method:

![Lorenz curve](https://dl.dropboxusercontent.com/u/47978121/gsoc/nyaplot3d.png)

To learn more, see [the notebook](http://nbviewer.ipython.org/github/domitry/Nyaplot/blob/master/examples/notebook/3DPlot.ipynb).

## Installation

This gem is still under development and is not registered to RubyGems.org. Therefore clone this repository and build gem by yourself to try it.

Clone this repository:

    git clone git@github.com:domitry/nyaplot.git
    
And then build and install using gem command:

    cd nyaplot
    gem build nyaplot.gemspec
    gem install nyaplot-0.0.1.gem

<!--
Add this line to your application's Gemfile:

    gem 'nyaplot'

And then execute:

    $ bundle

Or install it yourself as:

    $ gem install nyaplot
-->

## How to use
### Create plot
```ruby
require 'nyaplot'
plot = Nyaplot::Plot.new
plot.width(500)
plot.height(500)
```

### Add diagrams
```ruby
bar = plot.add(:bar, ['nya1', 'nya2', 'nya3'],[10,20,30])
bar.title('the number of cats')
```
The first argument of plot.add indicates the type of diagrams to add, as :bar, :line, :scatter, and :venn.

### Generate static html file
```ruby
plot.export_html
```
Nyaplot::Plot.export_html returns the html code as an instance of String.

### Interaction with IRuby notebook
Nyaplot is designd to work with [IRuby](https://github.com/minad/iruby), a web-based interactive Ruby environment. Before running codes shown below, install IPython and IRuby.

```ruby
Nyaplot.init_iruby
plot.show
```
See [an example](http://nbviewer.ipython.org/github/domitry/Nyaplot/blob/master/examples/notebook/Introduction.ipynb). 

## Contributing

1. Fork it ( http://github.com/domitry/nyaplot/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

This gem is the front-end library for Nyaplot and the functions on visualization is mainly implemented in the back-end library. To contribute to the JavaScript side, visit [the repository](https://github.com/domitry/Nyaplotjs) for the back-end library, Nyaplotjs. Those two libraries will be merged after the GSoC 2014 term.

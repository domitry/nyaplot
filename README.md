# Nyaplot
![alt text](https://dl.dropboxusercontent.com/u/47978121/gsoc/nyaoplot_top.png)

Nyaplot is a interactive plots generator for Ruby users. Its goal is to provide the way to create interactive plots in their favorite styles and still allows fast prototyping, customizability, and integration to SciRuby components. 

Nyaplot is a compound word from 'Nya' and 'plot.' The word 'Nya' comes from a onomatopoeia of cat's meow in Japanese.

This software has been developed as a product in Google Summer of Code 2014 (GSoC2014). Please visit a website of [SciRuby project](http://sciruby.com/blog/) to see the progress of this project.

## Demo
+ [IRuby notebook example](http://nbviewer.ipython.org/github/domitry/Nyaplot/blob/master/examples/notebook/Introduction.ipynb)

## Installation

Add this line to your application's Gemfile:

    gem 'nyaplot'

And then execute:

    $ bundle

Or install it yourself as:

    $ gem install nyaplot

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
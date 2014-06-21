# Ecolirb
![alt text](https://dl.dropboxusercontent.com/u/47978121/gsoc/top_rb.png)

the Ruby front-end library of Ecoli.js

## Installation

Add this line to your application's Gemfile:

    gem 'ecolirb'

And then execute:

    $ bundle

Or install it yourself as:

    $ gem install ecolirb

## How to use
```ruby
require 'ecolirb'
Ecolirb.init_iruby
bar = Ecolirb.Bar.new([5,14,2,9])
bar.show
```

## Contributing

1. Fork it ( http://github.com/<my-github-username>/ecolirb/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

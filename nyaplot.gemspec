# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'nyaplot/version'

Gem::Specification.new do |spec|
  spec.name          = "nyaplot"
  spec.version       = Nyaplot::VERSION
  spec.authors       = ["Naoki Nishida"]
  spec.email         = ["domitry@gmail.com"]
  spec.summary       = %q{Nyaplot is an interactive plots generator based on Web technology like SVG, WebGL, and JavaScript.}
  spec.description   = %q{Nyaplot is an Interactive plots generator based on Web technology like SVG, WebGL, and JavaScript. It enables us to create interactive plots interactively on IRuby notebook, a web-based Ruby environment. Nyaplot is totally web-based gem and plots can be embedded into Rails or Sinatra seemlesly. Supported charts include basic 2D plot, 3D plot, Map plot and plot for Biology. See nbviewer (http://nbviewer.ipython.org/github/domitry/nyaplot/blob/master/examples/notebook/Index.ipynb) to overview what plots can be created with nyaplot and how to do it.}
  spec.homepage      = "https://www.github.com/domitry/nyaplot"
  spec.license       = "MIT"
  spec.post_install_message = <<-EOF
************************************************************************
Welcome to Nyaplot

 ___/|
 \o.O| 
 (___)
   U

Thank you for installing Nyaplot gem.

We strongly recommend you to install IRuby, an interactive
Ruby environment on web browser at the same time.

$ gem install iruby

If you wonder how to use Nyaplot, see /path/to/nyaplot/examples/notebook
and run `iruby notebook` in the directory.
You can find these notebook on your browser:
http://nbviewer.ipython.org/github/domitry/nyaplot/blob/master/examples/notebook/Index.ipynb

You can also use nyaplot without IRuby like /path/to/nyaplot/examples/rb
or on your browser:
https://github.com/domitry/nyaplot/tree/master/examples/rb

Feel free to raise Issue or Pull-request on GitHub.
Most pull-request might be accepted unless it is broken or too destructive.

Enjoy Nyaplot!
************************************************************************
EOF

  spec.files         = `git ls-files -z`.split("\x0").select{|fname| !(fname=~/.ipynb/)}
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})
  spec.require_paths = ["lib"]
  spec.required_ruby_version = ">= 2.0"

  spec.add_development_dependency "bundler", "~> 1.5"
  spec.add_runtime_dependency "mikon", "~> 0.1.2.rc1"
  spec.add_development_dependency "rake"
  spec.add_development_dependency "rspec"
  spec.add_development_dependency "pry"
end

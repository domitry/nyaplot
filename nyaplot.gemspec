# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'nyaplot/version'

Gem::Specification.new do |spec|
  spec.name          = "nyaplot"
  spec.version       = Nyaplot::VERSION
  spec.authors       = ["Naoki Nishida"]
  spec.email         = ["domitry@gmail.com"]
  spec.summary       = %q{interactive plots generator for Ruby users}
  spec.description   = %q{To get information about Nyaplot, visit the website or mailing-list of SciRuby, or ask me on GitHub.}
  spec.homepage      = "https://www.github.com/domitry/nyaplot"
  spec.license       = "MIT"

  spec.files         = `git ls-files -z`.split("\x0")
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})
  spec.require_paths = ["lib"]

  spec.add_development_dependency "bundler", "~> 1.5"
  spec.add_development_dependency "rake"
  spec.add_development_dependency "rspec"
  spec.add_development_dependency "pry"
end

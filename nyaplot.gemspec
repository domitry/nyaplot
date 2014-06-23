# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'nyaplot/version'

Gem::Specification.new do |spec|
  spec.name          = "nyaplot"
  spec.version       = Nyaplot::VERSION
  spec.authors       = ["domitry"]
  spec.email         = ["domitry@gmail.com"]
  spec.summary       = %q{the Ruby front-end library of Ecoli.js}
  spec.description   = %q{the Ruby front-end library of Ecoli.js}
  spec.homepage      = ""
  spec.license       = "MIT"

  spec.files         = `git ls-files -z`.split("\x0")
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})
  spec.require_paths = ["lib"]

  spec.add_development_dependency "bundler", "~> 1.5"
  spec.add_development_dependency "rake"
  spec.add_development_dependency "rspec"
end

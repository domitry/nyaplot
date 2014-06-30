require 'nyaplot'
require 'json'

module Nyaplot
  class ColorFactory
    include Singleton

    def initialize
      path = File.expand_path("../colorbrewer/colorbrewer.json", __FILE__)
      color_set = JSON.parse(FILE.read(path))
      color_set.each do |name, colors|
        define_method(name.intern) {|required_num|
          return colors.each {|num, arr| return arr if num > required_num}
        }
      end

      alias_method :hot, :YlOrRd
      alias_method :jet, :RdYlBu
      alias_method :binary, :Greys
    end
  end

  class Color
    def initialize(method=:PuBu)
      @method = method
      @seek = 0
    end

    def pick
    end
  end
end

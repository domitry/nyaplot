require 'json'

module Nyaplot
  module Jsonizable

    def self.included(cls)
      cls.extend ClassMethod
    end

    def before_to_json
    end

    def init_properties
      @properties = {}
    end

    def to_json(*args)
      before_to_json
      @properties.to_json
    end

    def set_property(symbol, val)
      self.send(symbol, val)
    end

    def get_property(symbol)
      self.send(symbol)
    end

    module ClassMethod
      def define_properties(*symbols)
        symbols.each do |symbol|
          define_method(symbol) {|val=nil|
            return @properties[symbol] if val.nil?
            @properties[symbol] = val
          }
        end
      end

      def define_group_properties(name, symbols)
        define_properties(name)
        symbols.each do |symbol|
          define_method(symbol) {|val=nil|
            return @properties[name][symbol] if val.nil?
            @properties[name][symbol] = val
          }
        end
      end
    end
  end
end

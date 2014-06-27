require 'json'

module Nyaplot
  module Jsonizable
    def self.included(cls)
      cls.extend ClassMethod
    end

    def before_to_json
    end

    def to_json(*args)
      before_to_json
      @properties ||= {}
      @properties.to_json
    end

    def init_properties
      @properties = {}
    end

    def set_property(symbol, val)
      @properties ||= {}
      @properties[symbol] = val
    end

    def get_property(symbol)
      @properties ||= {}
      @properties[symbol]
    end

    module ClassMethod
      def define_properties(type, *symbols)
        symbols.each do |symbol|
          define_method(symbol) {|val|
            raise "Invailed type error" unless val.kind_of?(type)
            @properties ||= {}
            @properties[symbol] = val
          }
        end
      end

      def define_group_properties(name, symbols)
        symbols.each do |symbol|
          define_method(symbol) {|val|
            @properties[name] ||= {}
            @properties[name][symbol] = val
          }
        end
      end
    end
  end
end

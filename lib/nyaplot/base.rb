require 'json'

module Nyaplot
  module Jsonizable
    def self.included(cls)
      cls.extend ClassMethod
    end

    def to_json(*args)
      @properties ||= {}
      @properties.to_json
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
        hash = {}
        symbols.each do |symbol|
          define_method(symbol) {|val|
            hash[symbol] = val
          }
        end
        @properties[name] = hash
      end
    end
  end
end

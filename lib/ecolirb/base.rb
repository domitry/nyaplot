module Ecolirb
  module Base
    def self.included(cls)
      cls.extend ClassMethod
    end

    def to_json
      @properties.to_json
    end

    module ClassMethod
      def initialize
        super
        @properties |= {}
      end

      def define_properties(type, *symbols)
        symbols.each do |symbol|
          define_method(symbol) {|val|
            raise "Invailed type error" unless val.kind_of?(type)
            @properties[symbol] = val
          }
        end
      end
    end
  end
end

module Ecolirb
  module Base
    def define_properties(type, *symbols)
      @properties |= {}
      symbols.each do |symbol|
        define_method(symbol) {|val|
          raise "Invailed type error" unless val.kind_of?(type)
          @properties[symbol] = val
        }
      end
    end

    def to_json
      @properties.to_json
    end
  end
end

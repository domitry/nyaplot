require 'json'

module Nyaplot

  # The module to be included by internal classes
  module Jsonizable

    def self.included(cls)
      cls.extend ClassMethod
    end

    def before_to_json
    end

    # This method should be excuted when initializing class includes Jsonizable
    def init_properties
      @properties = {}
    end

    def to_json(*args)
      before_to_json
      @properties.to_json
    end

    # Prepared to expressly set property
    def set_property(symbol, val)
      self.send(symbol, val)
    end

    # Prepared to expressly get property
    def get_property(symbol)
      self.send(symbol)
    end

    module ClassMethod

      # Define getter/setter for each property
      # @param [Symbol] symbols Name for each property
      def define_properties(*symbols)
        symbols.each do |symbol|
          define_method(symbol) {|val=nil|
            return @properties[symbol] if val.nil?
            @properties[symbol] = val
            return self
          }
        end
      end

      # Define getter/setter for each property and group.
      # Grouped properties will be merged into one parameter when running to_json.
      # @param [Symbol] name Group name
      # @param [Symbol] symbols Name for each property
      # @example
      #   define_group_properties(:options, [:hoge, :nya]) #The methods :options, :hoge, :nya are defined
      #   options({})
      #   hoge(3)
      #   nya(4)
      #   some_instance.to_json #-> {options:{hoge: 3, nya:4}}
      def define_group_properties(name, symbols)
        define_properties(name)
        symbols.each do |symbol|
          define_method(symbol) {|val=nil|
            return @properties[name][symbol] if val.nil?
            @properties[name][symbol] = val
            return self
          }
        end
      end
    end
  end
end

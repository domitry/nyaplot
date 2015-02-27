require 'json'

module Nyaplot
  module Base
    attr_accessor :dependency, :uuid

    def self.included(cls)
      cls.extend ClassMethods
    end

    # @example
    #   Glyph::Scatter.new(data: data, x: :x, y: :y)
    #   #-> #<Nyaplot::Glyph::Scatter|0aff1e>
    #
    def initialize(*args)
      @uuid = SecureRandom.uuid
      @dependency= []
      @args = {}

      class << @args
        def to_json(*args)
          args_ = self.reduce({}) do |memo, val|
            memo[val[0]]= val[1].is_a?(Nyaplot::Base) ? {sync: val[1].uuid} : val[1]
            memo
          end
          args_.to_json
        end
      end

      self.attr(args.first) if args.length == 1 && args.first.is_a?(Hash)
    end

    def attr(hash)
      hash.each do |val|
        self.send(val[0], val[1])
      end
    end

    def add_dependency(*given)
      given.each do |obj|
        raise RuntimeError unless obj.is_a?(Nyaplot::Base)
        @dependency.push(obj)
      end
    end

    def remove_dependency(obj)
      @dependency.delete(obj)
    end

    def verify
      raise "Type name should be specified" if self.class.class_variable_get("@@type".to_sym).nil?
      args = self.class.class_variable_get("@@required_args".to_sym)
      args.each do |s|
        raise s.to_s + " of " + self.to_s + " should be set" unless @args.has_key?(s)
      end
    end

    # over-write it
    def before_to_json
    end

    def to_json(*args)
      before_to_json
      verify
      {
        type: self.class.class_variable_get("@@type".to_sym),
        uuid: @uuid,
        args: @args
      }.to_json
    end

    module ClassMethods
      def type(symbol)
        self.class_variable_set("@@type".to_sym, symbol)
      end

      private
      def define_accessor(s)
        define_method(s) do |val=nil|
          next @args[s] if val.nil?
          if val.is_a? Nyaplot::Base
            remove_dependency(@args[s]) unless @args[s].nil?
            add_dependency(val)
          end
          @args[s] = val
          self
        end
      end

      def required_args(*symbols)
        name = "@@required_args".to_sym
        arr = (self.class_variable_defined?(name) ? self.class_variable_get(name) : [])
        self.class_variable_set(name, arr.concat(symbols))

        symbols.each do |s|
          define_accessor s
        end
      end

      def optional_args(*symbols)
        symbols.each {|s| define_accessor s}
      end
    end
  end
end

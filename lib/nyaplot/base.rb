require 'json'

module Nyaplot
  module Base
    attr_reader :dependency, :uuid

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

      self.attr(args.first) if args.length == 1 && args[0].is_a?(Hash)
    end

    class << @args
      def to_json(*args)
        args = self.reduce({}) do |memo, k, v|
          memo[k]= v.is_a? Nyaplot::Base ? {sync: v.uuid} : v
          memo
        end
        args.to_json
      end
    end

    def attr(hash)
      args[0].each do |k, v|
        self.call(k, v)
      end
    end

    def add_dependency(*given)
      given.each do |obj|
        raise RuntimeError unless obj.is_a? Nyaplot::Object
        @dependency.push(obj)
      end
    end

    def remove_dependency(obj)
      @dependency.delete(obj)
    end

    def verify
      raise RuntimeError if @@type.nil?
      raise RuntimeError unless @@required_args.all?{|s| @args.has_key? s}
    end

    # over-write it
    def before_to_json
    end

    def to_json(*args)
      before_to_json
      verify
      {
        type: @@type,
        uuid: @uuid,
        args: @args
      }.to_json
    end

    module ClassMethods
      def type(symbol)
        @@type = symbol
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
        end
      end

      def required_args(*symbols)
        @@required_args ||= []
        @@required_args.concat(symbols)

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

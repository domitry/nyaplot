require 'json'

module Nyaplot
  module Base
    attr_reader :dependency, :uuid

    def self.included(cls)
      cls.extend ClassMethods
    end

    def initialize
      @uuid = SecureRandom.uuid
      @dependency= []
      @args = {}
    end

    def add_dependency(obj)
      unless obj.is_a? Nyaplot::Object raise RuntimeError
        @dependency.push(obj)
      end
    end

    def verify
      raise RuntimeError if @@type.nil?
      raise RuntimeError unless @@required_args.all?{|s| @args.has_key? s}
    end

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

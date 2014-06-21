module Ecolirb
  class Pane
    include Ecolirb::Base

    define_properties(Array, :diagrams)
    define_properties(String, :type)
    define_properties(Hash, :options)

    def initialize(&block)
      self.instance_eval(&block) if block_given?
    end
  end
end

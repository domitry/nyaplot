module Nyaplot
  class Diagram
    include Jsonizable

    define_properties(String, :type)
    define_properties(String, :data)
    define_group_properties(:options, [])

    def initialize(type, data)
      self.type(type)

    end

    def configure(&block)
      self.instance_eval(&block) if block_given?
    end
  end
end

module Nyaplot
  module Layers
    class LayerBase
      class << self
        def define_args(*args)
          args.each do |s|
            define_method(s) do |val=nil|
              unless val.nil?
                @props[s] = val
                self
              else
                @props[s]
              end
            end
          end
        end
      end

      attr_reader :uuid
      
      def initialize(props={})
        @uuid = SecureRandom.uuid
        @props = props
      end

      def to_node(children=[])
        {
          uuid: @uuid,
          children: children
        }
      end

      def to_json(*args)
        args = @props.reduce({}) do |memo, pair|
          memo[pair[0]] = pair[1] unless pair[1].is_a? LayerBase
          memo
        end
        
        sync_args = @props.reduce({}) do |memo, pair|
          memo[pair[0]] = pair[1].uuid if pair[1].is_a? LayerBase
          memo
        end

        {
          type: self.class.name.downcase.split("::").last,
          uuid: @uuid,
          args: args,
          sync_args: sync_args
        }.to_json
      end
    end
  end
end

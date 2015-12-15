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
        is_sync = Proc.new do |l|
          l.is_a?(LayerBase) || ((l.is_a?(Array) && l.all? {|cl| cl.is_a?(LayerBase)}))
        end
        
        args = @props.reduce({}) do |memo, pair|
          memo[pair[0]] = pair[1] unless is_sync.call(pair[1])
          memo
        end
        
        sync_args = @props.reduce({}) do |memo, pair|
          if is_sync.call(pair[1])
            memo[pair[0]] = (pair[1].is_a? LayerBase) ? pair[1].uuid : pair[1].map{|l| l.uuid}
          end
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

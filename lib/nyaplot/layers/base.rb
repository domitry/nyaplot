module Nyaplot
  class LayerBase
    class << self
      def define_args(*args)
        args.each do |s|
          define_method(s) do |val=nil|
            unless val.nil?
              @props[s] = val
            else
              @props[s]
            end
            self
          end
        end
      end
    end

    def initialize(props={})
      @uuid = SecureRandom.uuid
      @props = props
    end

      args = @props.reduce({}) do |memo, pair|
        memo[pair[0]] = pair[1] unless pari[1].is_a? LayerBase
        memo
      end
      
      sync_args = @props.reduce({}) do |memo, pair|
        memo[pair[0]] = pair[1].uuid if pair[1].is_a? LayerBase
        memo
      end

      {
        uuid: @uuid,
        args: args,
        sync_args: sync_args
      }.to_json
      def to_json(*args)
    end
  end
end

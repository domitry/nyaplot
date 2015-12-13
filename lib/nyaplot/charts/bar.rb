require_relative './base'

module Nyaplot
  module Charts
    class Bar < ChartBase
      allow :ordinal, :linear
      need :data, :x, :y, :xscale, :yscale
      
      ## data: {ylabel: [1,2,3], xlabel: [:a, :b. :c]} or equal dataframe
      def create(**opts)
        data = opts[:data]
        
        data[opts[:x]].each_with_index do |str, i|
          data2 = {x1: [-0.8], x2: [0.8], y2: [0], y1: [data[opts[:y]][i]]}
          data_l = ad Layers::Data.new({data: data2})
          
          pos = create_ordinal_position(opts[:xscale], opts[:yscale], str)
          args = {
            data: data_l,
            x1: :x1,
            x2: :x2,
            y1: :y1,
            y2: :y2,
            position: ad(create_ordinal_position(opts[:xscale], opts[:yscale], str))
          }
          ag Layers::Rect.new(args)
        end

        @xdomain = data[opts[:x]]
        @ydomain = [0, data[opts[:y]].max]
      end
    end
  end
end

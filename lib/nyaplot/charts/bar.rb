require_relative './base'

module Nyaplot
  module Charts
    class Bar < ChartBase
      allow :ordinal, :linear
      need :data, :x, :y, :xscale, :yscale
      
      ## data: {ylabel: [1,2,3], xlabel: [:a, :b. :c]} or equal dataframe
      def create(**opts)
        data = opts[:data]
        accessor = nil

        unless opts[:fill_by].nil? && opts[:colors].nil?
          cs = opts[:colors]
          s = ad Layers::Scale.new({domain: data[opts[:x]], range: cs, type: "discrete"})
          accessor = ad Layers::Accessor.new({scale: s, label: opts[:fill_by]})
        end
        
        data[opts[:x]].each_with_index do |str, i|
          data2 = data.reduce({}){|memo, pair| memo[pair[0]] = [pair[1][i]]; memo}
                  .merge({x1: [-0.8], x2: [0.8], y2: [0], y1: [data[opts[:y]][i]]})
          
          data_l = ad Layers::Data.new({data: data2})

          args = {
            data: data_l,
            x1: :x1,
            x2: :x2,
            y1: :y1,
            y2: :y2,
            position: create_ordinal_position(opts[:xscale], opts[:yscale], str),
            stroke_color: 'none'
          }

          args[:color]= accessor unless accessor.nil?
          
          ag Layers::Rect.new(args)
        end

        @xdomain = data[opts[:x]]
        @ydomain = [0, data[opts[:y]].max]
      end
    end
  end
end

module Nyaplot
  module Charts
    class Scatter < ChartBase
      allow :all, :all
      need :data, :x, :y, :position

      def create(**opts)
        data = opts[:data]
        data_l = ad Layers::Data.new({data: data})
        
        args = {
          data: data_l,
          x: opts[:x],
          y: opts[:y],
          position: opts[:position]
        }

        ag Layers::Scatter.new(args)

        @xdomain = [data[opts[:x]].min, data[opts[:x]].max]
        @ydomain = [data[opts[:y]].min, data[opts[:y]].max]
      end
    end
  end
end

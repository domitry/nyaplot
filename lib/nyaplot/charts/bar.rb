module Nyaplot
  module Charts
    class Bar
      allow :ordinal, :linear
      need :data, :x, :y, :xscale, :yscale
      
      ## data: {ylabel: [1,2,3], xlabel: [:a, :b. :c]} or equal dataframe
      def create(**opts)
        data = opts[:data]
        ad Layers::Data.new({data: data})
        
        data[opts[:x]].each_with_index do |str, i|
          pos = create_ordinal_position(opts[:xscale], opts[:yscale], str)
          args = {
            data: data,
            x1: -0.8,
            x2: 0.8,
            y1: 0,
            y2: data[opts[:y]][i],
            position: ad(create_ordinal_position(opts[:xscale], opts[:yscale], str))
          }
          ag Layers::Rect.new(args)
        end

        @ydomain = [0, data[opts[:y]].max]
      end
    end
  end
end

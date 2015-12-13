require_relative './charts/bar'

module Nyaplot
  module ChartMethods
    def bar(**opts)
      if @df.nil?
        data = @df
      else
        if opts[:data].nil?
          data = opts[:data]
        elsif opts[:df].nil?
          data = opts[:df]
        else
          raise ""
        end
      end

      opts = {
        data: data,
        xscale: @xscale,
        yscale: @yscale,
        position: @position,
      }.merge(opts)
      
      chart = Bar.new(opts)
      @deps.concat(chart.deps)
      @glyphs.concat(chart.glyphs)
      self
    end

    ## short-cut methods for adding primitives
    def add_annotation()
      add_text
      add_arrow
    end

    def add_rect()
    end

    def add_circle()
    end

    def add_text()
    end

    def add_arrow()
    end
  end
end

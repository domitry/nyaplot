require_relative './charts/bar'
require_relative './charts/line'
require_relative './charts/scatter'

module Nyaplot
  module ChartMethods
    [
      ["bar", Charts::Bar],
      ["line", Charts::Line],
      ["scatter", Charts::Scatter]
    ].each do |pair|
      mname, constant = pair
      define_method(mname) do |**opts|
        unless @df.nil?
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

        args = {
          data: data,
          xscale: @xscale,
          yscale: @yscale,
          position: @position,
        }
        opts = @opts.merge(args).merge(opts)
        chart = constant.new(opts)
        @charts.push(chart)
        @deps.concat(chart.deps)
        @glyphs.concat(chart.glyphs)
        self
      end
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

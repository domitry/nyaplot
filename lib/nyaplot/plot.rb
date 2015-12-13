require_relative './exportable'
require_relative './chart_method'
require_relative './layers/layers'

module Nyaplot
  class Plot
    # @example
    # Plot.from(df, x: :hoge, y: :nya).bar
    # Plot.from(df).scatter(x: hoge, y: nya)
    # Plot.add(:scatter, xarr, yarr)
    #
    include Exportable
    include ChartMethods
    
    class << self
      def from(df, **opts)
        Plot.new(df, **opts)
      end
    end
    
    def initialize(df=nil, **opts)
      @df = df
      @opts = {
        width: 400,
        height: 400
      }.merge(opts)

      wh = {
        width: @opts[:width],
        height: @opts[:height]
      }
      
      @xdomain = nil
      @ydomain = nil
      
      ## internal use
      @glyphs = []
      @charts = []
      @deps = []
      @temp_deps = []

      ## properties
      @x_axis_h = 35
      @y_axis_w = 70
      @with_layer
      
      ## layers
      @stage = ad ::Layers::Stage.new({})
      @context = ad ::Layers::Context.new(wh)
      @background = ad ::Layers::Background.new(
        {
          width: wh[:width]+4,
          height: wh[:height]+4,
          dx: -2,
          dy: -2
        })
      @grid = ad ::Layers::Grid.new(wh)
      
      @xscale = ad ::Layers::Scale.new({type: :linear, range: [0, @opts[:width]]})
      @yscale = ad ::Layers::Scale.new({type: :linear, range: [@opts[:height], 0]})

      @xaxis = ad ::Layers::Axis.new({scale: @xscale, height: @x_axis_h})
      @yaxis = ad ::Layers::Axis.new({scale: @yscale, orient: :left, width: @y_axis_w})

      @grid = ad ::Layers::Grid.new({xscale: @xscale, yscale: @yscale})
      @position = ad ::Layers::Position2d.new({x: @xscale, y: @yscale})
      
      @title = nil
      @xlabel = nil
      @ylabel = nil
    end

    def add_dependency(layer)
      raise "Layer should be an instance of LayerBase" unless layer.is_a? ::Layers::LayerBase
      @deps.push(layer)
      layer
    end
    alias :ad :add_dependency

    
    def add_temp_dependency(layer)
      @temp_deps.push(layer)
      layer
    end
    alias :atd :add_temp_dependency

    
    def clear_temp_dependency
      @temp_deps = []
    end
    
    def add(chart_type, xarr=nil, yarr=nil, **opts)
      self.send(chart_type, @opts.merge(opts))
      self
    end

    # deprecated.
    def add_with_df(df, chart_type, xlabel, ylabel)
      # TODO
      self
    end
    
    def title(txt)
      arg = {
        dx: (@y_axis_w/2),
        text: txt,
        font_size: 26,
        text_anchor: :start,
        yalign: :center,
        xalign: :center,
        margin: {top: 0, bottom: 20, left: 5, right: 5}
      }
      @title = ad ::Layers::Label.new(arg)
      self
    end

    def xlabel(txt)
      arg = {
        dx: @y_axis_w/2,
        text: txt,
        xalign: :center,
        dominant_baseline: "text-before-edge"
      }
      @xlabel = ad ::Layers::Label.new(arg)
      self
    end

    def ylabel(txt)
      arg = {
        text: txt,
        rotate: -90,
        xalign: :center,
        yalign: :center
      }
      @ylabel = ad ::Layers::Label.new(arg)
      self
    end

    def xscale(type)
      raise "Not supported." unless [:time, :linear, :log, :power, :ordinal].index type
      @xscale.type type
      self
    end

    def yscale(type)
      raise "Not supported." unless [:time, :linear, :log, :power, :ordinal].index type
      @yscale.type type
      self
    end

    def xdomain(arr)
      @xdomain = arr
      self
    end

    def ydomain(arr)
      @ydomain = arr
      self
    end

    ## s methods for #to_json ##
    
    def stack(me, children)
      children = children.map{|c| c.is_a?(::Layers::LayerBase) ? c.to_node([]) : c}
      me.to_node(children)
    end
    
    def column(r, l, opts={})
      r = r.to_node if r.is_a? ::Layers::LayerBase
      l = l.to_node if l.is_a? ::Layers::LayerBase
      cl = atd ::Layers::Column.new(opts)
      cl.to_node([r, l])
    end
    
    def row(t, b, opts={})
      t = t.to_node if t.is_a? ::Layers::LayerBase
      b = b.to_node if b.is_a? ::Layers::LayerBase
      rw = atd ::Layers::Row.new(opts)
      rw.to_node([t, b])
    end
    
    def decide_xdomain(scale_type)
      arrs = @charts.map{|c| c.xdomain}
      decide_domain(arrs, scale_type)
    end
    
    def decide_ydomain(scale_type)
      arrs = @charts.map{|c| c.ydomain}
      decide_domain(arrs, scale_type)
    end

    def decide_domain(arrs, scale_type)
      scale_type = (arrs.all?{|arr| arr.length==2 && arr.all?{|v| v.is_a?(Numeric)}}) ? "linear" : "ordinal"

      [scale_type, (case scale_type.to_s
       when "time" then
         [] # TODO
       when "ordinal"then
         arrs.flatten.uniq
       when "linear", "power", "log" then
         [
           arrs.map{|arr| arr[0]}.min,
           arrs.map{|arr| arr[1]}.max
         ]
       end)]
    end

    def to_json(*args)
      ## decide domain
      xscale_, xdomain = @xdomain.nil? ? decide_xdomain(@xscale.type) : @xdomain
      yscale_, ydomain = @ydomain.nil? ? decide_ydomain(@yscale.type) : @ydomain
      @xscale.type xscale_
      @xscale.domain xdomain
      @yscale.type yscale_
      @yscale.domain ydomain
      
      ## create layout tree
      c = stack(@context, @glyphs)
      c = stack(@grid, [c])
      c = stack(@background, [c])
      # c = stack(@tooltip, [c])
      # c = stack(@wheel_zoom, [c])
      c = column(@yaxis, row(c, @xaxis), {margin: {top: 10, bottom: 15, left: 15, right: 15}})
      c = row(c, @xlabel) unless @xlabel.nil?
      c = column(@ylabel, c) unless @ylabel.nil?
      #c = column(c, @legend)
      c = row(@title, c) unless @title.nil?
      c = stack(@stage, [c])
      c[:parser_type] = "svg"

      defs = @deps + @temp_deps + @glyphs
      clear_temp_dependency
      
      {
        uuid: SecureRandom.uuid,
        defs: defs,
        layout: c
      }.to_json
    end
  end
end

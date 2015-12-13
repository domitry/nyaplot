require 'erb'

module Nyaplot
  # Create multi-column layout
  # @example
  #   include Nyaplot
  #   p1 = Plot.add(:scatter, x1, y1)
  #   p2 = Plot.add(:line, x2, y2)
  #   columns(p1, p2).draw
  #
  def columns(*plots)
    panes = plots.map{|p| p.pane}
    plot = Plot.new
    plot.pane = Pane.columns(*panes)
    plot
  end

  # Create multi-row layout
  # @example
  #   include Nyaplot
  #   p1 = Plot.add(:scatter, x1, y1)
  #   p2 = Plot.add(:line, x2, y2)
  #   p3 = Plot.add(:bar, x3, y3)
  #   rows(columns(p1, p2), p3).draw
  #
  def rows(*plots)
    panes = plots.map{|p| p.pane}
    plot = Plot.new
    plot.pane = Pane.rows(*panes)
    plot
  end
end

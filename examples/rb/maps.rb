require 'nyaplot'
require 'mapnya'

raw_df = Nyaplot::Countries.df

hash = [:name, :lat, :lng, :area, :capital].map{|label| {label => raw_df.column(label).to_a}}.reduce({}){|memo, hash| memo.merge(hash)}
df = Nyaplot::DataFrame.new(hash)

color = Nyaplot::Colors.Reds

plot = Nyaplot::MapPlot.new
sc = plot.add_with_df(df, :scatter, :lng, :lat) # x->:lng, y->lat
sc.configure do
  tooltip_contents([:capital, :name, :area])
  color(color)
  size([10, 100000])
  size_by(:area)
  fill_by(:area)
end
plot.export_html("scatter_on_the_map.html")

plot = Nyaplot::MapPlot.new
plot.add_map("AUS")
plot.scale(800)
plot.export_html("australia.html")

plot.add_map("JPN")
plot.export_html("japan.html")


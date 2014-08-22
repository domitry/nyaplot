require 'nyaplot'
require 'mapnya'

path = File.expand_path("../../notebook/data/wind.csv", __FILE__)
abs = []
df = Nyaplot::DataFrame.from_csv(path)
df.filter!{|row| !(row[:lon] < 200 && row[:lon] > 175)}
df.each_row{|row| row[:uwnd] = row[:uwnd]/3; row[:vwnd] = row[:vwnd]/3}
df.each_row{|row| abs.push(Math.sqrt(row[:uwnd]*row[:uwnd]+row[:vwnd]*row[:vwnd]))}
df.abs = abs

plot = Nyaplot::MapPlot.new
vectors = plot.add_with_df(df, :vectors, :lon, :lat)
vectors.dx(:uwnd)
vectors.dy(:vwnd)
vectors.fill_by(:abs)

color = Nyaplot::Colors.OrRd(3)
vectors.color(color)
plot.export_html("wind_vectors.html")

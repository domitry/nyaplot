require 'nyaplot'

samples = Array.new(10).map.with_index{|d,i| 'cat'+i.to_s}
address = ['London', 'Kyoto', 'Los Angeles', 'Puretoria']
x=[];y=[];home=[]

10.times do
  x.push(5*rand)
  y.push(5*rand)
  home.push(address.clone.sample)
end
df = Daru::DataFrame.new({x: x,y: y,name: samples, home: home})

plot = Nyaplot::Plot.new
plot.x_label("weight [kg]")
plot.y_label("height [m]")

color = Nyaplot::Colors.qual

sc = plot.add_with_df(df, :scatter, :x, :y)
sc.tooltip_contents([:name, :home])
sc.fill_by(:home)
sc.shape_by(:home)
sc.color(color)

plot.export_html("scatter.html")

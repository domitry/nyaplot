require 'nyaplot'

# Bar chart
plot = Nyaplot::Plot.new
plot.add(:bar, ['Persian', 'Maine Coon', 'American Shorthair'], [10,20,30])
plot.x_label("Species")
plot.y_label("Number")
plot.export_html("bar.html")

# Line chart
x = []; y = []; theta = 0.6; a=1
while theta < 14*Math::PI do
  x.push(a*Math::cos(theta)/theta)
  y.push(a*Math::sin(theta)/theta)
  theta += 0.1
end
plot1 = Nyaplot::Plot.new
plot1.add(:line, x, y)
plot1.export_html("line.html")

# Scatter + Line
sc_y=[]; line_x=sc_x=[]; line_y=[]; a=0.5; b=3; noise=1.5; x=0
rnd = Random.new
while x<10
  line_x.push(x)
  line_y.push(a*x+b)
  sc_y.push(a*x+b+noise*(rnd.rand-0.5))
  x=(x+0.5).round(1)
end
plot2 = Nyaplot::Plot.new
sc = plot2.add(:scatter, sc_x, sc_y)
line = plot2.add(:line, line_x, line_y)
sc.color('#000')
sc.title('point')
line.title('line')
plot2.legend(true)
plot2.export_html("scatter_line.html")

# Histogram
arr=[]
1000.times {|i| arr.push((Float(i-500)/1000)**2)}
print arr.to_s
plot3 = Nyaplot::Plot.new
plot3.add(:histogram, arr)
plot3.yrange([0,250])
plot3.export_html("histogram.html")

# Box plot
arr2 = arr.map{|val| val/0.8-2}
arr3 = arr.map{|val| val*1.1+0.3}
arr4 = arr.map{|val| val*1.3+0.3}
plot4 = Nyaplot::Plot.new
plot4.add(:box, arr, arr2, arr3, arr4)
plot4.export_html("box.html")

# 2D- Histogram
x=[]; y=[]; fill=[]
-5.step(5, 0.2) do |i|
  -5.step(5, 0.2) do |j|
    x.push(i)
    y.push(j)
    val = Math.sin(Math.sqrt(i*i+j*j))/Math.sqrt(i*i+j*j)
    fill.push((val.nan? ? 0 : val))
  end
end

plot5 = Nyaplot::Plot.new
hm = plot5.add(:heatmap, x, y, fill)
hm.stroke_color("#fff")
hm.stroke_width("0")
hm.width(0.2)
hm.height(0.2)
plot5.legend(true)
plot5.export_html("heatmap.html")

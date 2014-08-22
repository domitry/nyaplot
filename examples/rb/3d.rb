require 'nyaplot'
require 'nyaplot3d'

# Wireframe
x=[];y=[];z=[]
-10.step(10, 0.5) do |i|
  -10.step(10, 0.5) do |j|
    x.push(i)
    y.push(j)
    z.push(Math.sin(Math.sqrt(i*i+j*j))/Math.sqrt(i*i+j*j))
  end
end
z.map!{|val| next (val.nan? ? 0 : val)} #(0,0) will be -inf

plot = Nyaplot::Plot3D.new
plot.add(:wireframe, x, y, z)
plot.export_html("wireframe.html")

# Surface
plot = Nyaplot::Plot3D.new
plot.add(:surface, x, y, z)
plot.export_html("surface.html")

# Line
step_num = 10000;
p = 10; r = 28; b = 8/3; dt = 0.01

fx = Proc.new{|x,y,z| ((-1)*p*x + p*y)};
fy = Proc.new{|x,y,z| ((-1)*x*z + r*x - y)};
fz = Proc.new{|x,y,z| (x*y - b*z)};

x_arr=[]; y_arr=[]; z_arr=[]
x = 1; y = 1; z = 1
step_num.times do |i|
  x += dt * fx.call(x,y,z);
  y += dt * fy.call(x,y,z);
  z += dt * fz.call(x,y,z);
  x_arr.push(x);
  y_arr.push(y);
  z_arr.push(z);
end

plot = Nyaplot::Plot3D.new
plot.add(:line, x_arr, y_arr, z_arr)
plot.export_html("3dline.html")

# Scatter
plot = Nyaplot::Plot3D.new
colors = ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072']
['circle', 'rect', 'rect', 'diamond'].each do |shape|
  x, y, z = [0,0,0].map{|d| next Array.new(20, rand*5).map{|v| next v+rand}}
  sc = plot.add(:scatter, x, y, z)
  sc.shape(shape)
  sc.fill_color(colors.pop)
end
plot.export_html("3dscatter.html")

# Particles
plot = Nyaplot::Plot3D.new
['#ff7f00','#1f78b4','#a6cee3'].each_with_index do |color, index|
  x=[];y=[];z=[];dz = 5*rand
  0.step(1, 0.2) do |i|
    0.step(1, 0.2) do |j|
      x.push(i+rand)
      y.push(j+rand)
      z.push(Math.sin(i)*Math.sin(j)+dz+rand)
    end
  end
  p = plot.add(:particles, x, y, z)
  p.color(color)
  p.name('molecules')
end
plot.export_html("particles.html")

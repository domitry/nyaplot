require 'nyaplot'
require 'bionya'

arr = []
10.times do |i|
  arr.push({group: 'group' + i.to_s ,df: Daru::DataFrame.new({axis: ['a', 'b', 'c'], val: [2, 3, 4]})})
end
df = Daru::DataFrame.new(arr)

plot = Nyaplot::CircularPlot.new(df, :group, :df)
plot.add(1, :arc, :axis, :val)
plot.export_html("example_bionya.html")

df = Daru::DataFrame.from_csv(File.expand_path('../../notebook/data/circular/category.csv',__FILE__))
df2 = Daru::DataFrame.from_csv(File.expand_path('../../notebook/data/circular/hgmd.tsv', __FILE__), {col_sep: "\t"})
df3 = Daru::DataFrame.from_csv(File.expand_path('../../notebook/data/circular/genes_hgmd.tsv', __FILE__), {col_sep: "\t"})

hash2 = {}
df3.each_row do |row|
  chr_name = "chr" + row[:gene_name].match(/hs(.+)/)[1]
  hash2[chr_name] ||= []
  hash2[chr_name].push({locale: row[:start], name: row[:name]})
end

hash = {}
df2.each_row do |row|
  chr_name = "chr" + row[:gene_name].match(/hs(.+)/)[1]
  hash[chr_name] ||= []
  hash[chr_name].push({start: row[:start], val: row[:num2]})
end

bin_size = df.size.max/50
chr_name = df.column(:name).to_a
nested = df.column(:size).to_a.map.with_index do |size, i|
  vals = hash[chr_name[i]]
  names = hash2[chr_name[i]]
  vals = [] if vals.nil?
  names = [] if names.nil?
  raw = Array.new(size/bin_size, 0).map.with_index {|val, i|
    val = vals.reduce(0){|memo, v| next memo + v[:val] if v[:start] > i*bin_size && v[:start] < (i+1)*bin_size; memo}
    name = names.select {|name| name[:locale] > i*bin_size && name[:locale] < (i+1)*bin_size}
    {axis: i*bin_size, val: val, name: (name.length==0 ? '' : name[0][:name])}
  }
  Daru::DataFrame.new(raw)
end
df.df = nested

df.name = df.column(:name).to_a.map{|name| name.match(/chr(.+)/)[1]}
color = Nyaplot::Colors.qual

plot2 = Nyaplot::CircularPlot.new(df, :name, :df)
arc = plot2.add(1, :arc, :axis, :val)
arc.color(["rgb(56,108,176)"])
labels = plot2.add(2, :labels, :axis, :name)
labels.text_size("0.3em")
plot2.color(color)
plot2.text_size("0.5em")
plot2.text_color("#000")
plot2.export_html("mutations.html")

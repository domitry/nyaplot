require 'nyaplot'

path = File.expand_path("../../notebook/data/first.tab", __FILE__)
df = Nyaplot::DataFrame.from_csv(path, sep="\t")
df.filter! {|row| row[:set1] != 0.0}

plot4=Nyaplot::Plot.new
plot4.add_with_df(df, :histogram, :set1)
plot4.configure do
  height(400)
  x_label('PNR')
  y_label('Frequency')
  filter({target:'x'})
  yrange([0,130])
end

plot5=Nyaplot::Plot.new
plot5.add_with_df(df, :bar, :mutation)
plot5.configure do
  height(400)
  x_label('Mutation types')
  y_label('Frequency')
  yrange([0,100])
end

frame = Nyaplot::Frame.new
frame.add(plot4)
frame.add(plot5)
frame.export_html("multiple_pane.html")

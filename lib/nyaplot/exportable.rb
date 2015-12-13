module Nyaplot
  # Base class for Plot. Export methods are implemented here.
  # !! Classes to include PlotBase should have #to_json. !!
  # 
  module Exportable
    private
    def raise_display_failed
      raise "This method works only on IRuby. Use #to_html or install IRuby."
    end

    # generate static html file
    # @return [String] generated html
    def generate_html(to_png=false)
      path = File.expand_path("../templates/iruby.erb", __FILE__)
      id = SecureRandom.uuid
      model = to_json
      template = File.read(path)
      ERB.new(template).result(binding)
    end

    # export static html file
    def export_html(path="./plot.html", to_png=false)
      path = File.expand_path(path, Dir::pwd)
      body = generate_html(to_png)
      
      temp_path = File.expand_path("../templates/static_html.erb", __FILE__)
      template = File.read(temp_path)
      File.write(path, ERB.new(template).result(binding))
    end
    
    def to_png
      raise_display_failed unless defined? IRuby
      html = generate_html(true)
      ['text/html', html]
    end

    # show plot automatically on IRuby notebook
    def to_iruby
      raise_display_failed unless defined? IRuby
      html = generate_html
      ['text/html', html]
    end

    # show plot on IRuby notebook
    def show
      IRuby.display(self)
    end
  end
end

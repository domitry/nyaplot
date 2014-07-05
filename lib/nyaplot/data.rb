require 'nyaplot'
require 'securerandom'
require 'json'
require 'csv'

module Nyaplot
  class DataFrame
    def initialize(source, name=SecureRandom.uuid())
      @name = name
      @rows = []
      case
      when source.is_a?(Array)
        # like [{a:10, b:10},{a:20,b:20}]
        @rows = source
      when source.is_a?(Hash)
        # like {a:[10,20], b:[10, 20]}
        keys = source.keys
        len = source[keys[0]].length
        (0..len-1).each do |i|
          hash = {}
          keys.each{|key| hash[key] = source[key][i]}
          @rows.push(hash)
        end
      end

      # transform Symbol to String as a key
      unless @rows.all? {|row| row.keys.all? {|el| el.is_a?(String)}}
        @rows.map! do |row|
          row.inject({}) {|hash, (key, val)| hash[key.to_s]=val; hash}
        end
      end
    end

    def self.from_csv(path, sep=',', header=true)
      csv = CSV.open(path,"r",{col_sep: sep, :converters => :numeric})
      head = csv.readline if header
      head.map{|el| el.is_a?(String) ? el : el.to_s}
      rows=[]
      csv.each do |row|
        hash = {}
        row.each_with_index{|el,i| hash[head[i]] = el}
        rows.push(hash)
      end
      df = self.new(rows)
    end

    def filter(&block)
      DataFrame.new(@rows.select(&block))
    end

    def filter!(&block)
      @rows.select!(&block)
    end

    def name
      @name
    end

    def insert_column(name, arr)
      arr.each_with_index{|val| @rows[i][name]=val}
    end

    def column(name)
      column = []
      id = name.is_a?(String) ? name : name.to_s
      @rows.each{|row| column.push(row[id])}
      return Series.new(self, name, column)
    end

    def insert_row(row, index=@rows.length)
      @rows.insert(index, row)
    end

    def row(index)
      @rows[index]
    end

    def to_json(*args)
      @rows.to_json
    end

    def to_html(threshold = 15)
      html = '<table><tr>'
      @rows[0].each {|key, val| html.concat('<th>' + key.to_s + '</th>')}
      html += '</tr>'

      @rows.each_with_index do |row, i|
        next if i > threshold && i < @rows.length-1
        html += '<tr>'
        row.each{|key, val| html.concat('<td>' + val.to_s + '</td>')}
        html += '</tr>'
        if i == threshold
          html += '<tr>'
          row.length.times {html.concat('<td>...</td>')}
          html += '</tr>'
        end
      end
      html += '</table>'
    end

    def [](name)
      return self.column(name)
    end

    def method_missing(name, *args)
      if md = name.match(/(.+)\=/)
        self.insert_column(md[1], args[0])
        return
      else
        return self.column(name)
      end
    end
  end

  class Series
    def initialize(parent, label, arr)
      @parent = parent
      @arr = arr
      @label = label
    end

    def to_html(threshold=15)
      html = '<table><tr><th>' + label + '</th></tr>>'
      @arr.each_with_index do |el,i|
        next if threshold < i && i < @arr.length-1
        content = i == threshold ? '...' : el.to_s
        html.concat('<tr><td>' + content  + '</td></tr>')
      end
      html += '</table>'
    end

    def to_json(*args)
      @arr.to_json
    end

    def parent
      @parent
    end

    def to_a
      @arr
    end

    def label
      @label
    end
  end
end

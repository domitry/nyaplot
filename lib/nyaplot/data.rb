require 'nyaplot'
require 'securerandom'
require 'json'
require 'csv'

module Nyaplot
  class DataFrame
    DEFAULT_OPTS = {
      :col_sep => ',',
      :headers => true,
      :converters => :numeric
    }

    attr_reader :rows

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
      unless @rows.all? {|row| row.keys.all? {|el| el.is_a?(Symbol)}}
        @rows.map! do |row|
          row.inject({}) {|hash, (key, val)| hash[key.to_sym]=val; hash}
        end
      end
    end

    def self.from_csv(*args)
      path   = args.shift

      opts      = DEFAULT_OPTS
      if args.size > 0 && args.first.is_a?(Hash)
        opts    = opts.merge(args.shift)
      else
        opts[:col_sep] = args.shift if args.size > 0
        opts[:headers] = args.shift if args.size > 0
      end

      csv  = CSV.open(path, "r", opts)
      yield csv if block_given?

      head = if opts[:headers]
               csv.headers
             else
               csv.readline
             end

      rows = []
      csv.each do |row|
        hash = {}
        row.each_with_index do |el,i|
          hash[el[0]] = el[1]
        end
        rows << hash
      end
      self.new(rows)
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
      name = name.is_a?(Symbol) ? name : name.to_sym
      arr.each_with_index{|val, i| @rows[i][name]=val}
    end

    def column(name)
      id = name.is_a?(Symbol) ? name : name.to_sym
      column = @rows.map{|row| row[id]}
      return Series.new(name, column)
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

    def each_column(&block)
      self.column_labels.each do |label|
        block.call(column(label).to_a)
      end
    end

    def each_row(&block)
      @rows.each do |row|
        block.call(row)
      end
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

    def column_labels
      @rows[0].keys
    end

    def method_missing(name, *args)
      if md = name.match(/(.+)\=/)
        self.insert_column(name[/(.+)\=/].delete("="), args[0])
        return
      else
        return self.column(name)
      end
    end
  end

  class Series
    include Enumerable

    def initialize(label, arr)
      @arr = arr
      @label = label
    end

    def each
      @arr.each do |item|
        yield item
      end
    end

    def to_html(threshold=15)
      html = '<table><tr><th>' + label.to_s + '</th></tr>>'
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

    def to_a
      @arr
    end

    def label
      @label
    end
  end
end

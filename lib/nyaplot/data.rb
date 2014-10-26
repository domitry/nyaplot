require 'nyaplot'
require 'securerandom'
require 'json'
require 'csv'

module Nyaplot

  # Ruby DataFrame for plotting
  class DataFrame
    DEFAULT_OPTS = {
      :col_sep => ',',
      :headers => true,
      :converters => :numeric,
      :header_converters => :symbol
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

      # transform String to Symbol as a key
      unless @rows.all? {|row| row.keys.all? {|el| el.is_a?(Symbol)}}
        @rows.map! do |row|
          row.inject({}) do |hash, (key, val)|
            hash[key.to_sym]=val
            hash
          end
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

      rows = []
      csv.each do |row|
        hash = {}
        row.each_with_index do |el,i|
          next if el[0].nil? && el[1].nil?
          hash[el[0].to_sym] = el[1]
        end
        rows << hash
      end
      self.new(rows)
    end

    # Filtering row out using recieved block
    # @example
    #   new_df = df.filter{|row| row[:a] %2 == 0}
    def filter(&block)
      DataFrame.new(@rows.select(&block))
    end

    # destructive version of DataFrame#filter
    def filter!(&block)
      @rows.select!(&block)
    end

    # @return [String] the name of dataframe. If not specified when initializing, uuid v4 will be set.
    def name
      @name
    end

    def insert_column(name, arr)
      name = name.is_a?(Symbol) ? name : name.to_sym
      arr.each_with_index{|val, i| @rows[i][name]=val}
    end

    def delete_column(name)
      name = name.is_a?(Symbol) ? name : name.to_sym
      @rows.each do |row|
        row.delete(name)
      end
    end

    # Access column using its label
    def column(name)
      id = name.is_a?(Symbol) ? name : name.to_sym
      column = @rows.map{|row| row[id]}
      return Series.new(name, column)
    end

    # Insert row using index
    # @param [Hash] row row to insert
    # @param [Numeric] index if not specified, the row will be inserted to the end
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
      html = '<table>'

      unless @rows[0].nil?
        html += '<tr>'
        @rows[0].each {|key, val| html.concat('<th>' + key.to_s + '</th>')}
        html += '</tr>'
      end

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

    def to_s
      to_html
    end

    # The alias method for DataFrame#column
    def [](name)
      return self.column(name)
    end

    def column_labels
      @rows[0].keys
    end

    def method_missing(name, *args, &block)
      if md = name.match(/(.+)\=/)
        self.insert_column(name[/(.+)\=/].delete("="), args[0])
        return
      elsif column_labels.include?(name)
        return self.column(name)
      else
        super(name, *args, &block)
      end
    end
  end

  class Series
    include Enumerable
    def each(&block)
      @arr.each(&block)
    end

    def initialize(label, arr)
      @arr = arr
      @label = label
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

    def method_missing(meth, *args, &block)
      if @arr.respond_to?(meth)
        @arr.send(meth, *args, &block)
      else
        super(meth, *args, &block)
      end
    end

    def respond_to?(meth)
      return true if @arr.respond_to?(meth)
      super(meth)
    end

  end
end

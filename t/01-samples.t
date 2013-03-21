#!/usr/bin/perl
use strict;
use warnings;
use Data::Dumper;
use Test::More;
use File::Slurp qw/read_file read_dir/;

my @tests = sort grep /\.txt$/, read_dir('t/rf');

$ENV{RF_DECODER_PULSE_DEBUG} = 1;
foreach my $test (@tests) {
  my ($data, $rec_str, $res_str, $warn_str) =
    split /\n\n/, read_file('t/rf/'.$test);
  $data =~ s/\s+//g;
  my @data = map { $_*60 } unpack 'C*', pack 'H*', $data;
  my $index = 0;
  my @r;
  eval $rec_str or die "Eval of $rec_str failed: $@\n";
  ok @r, 'loaded '.$test;
  my $res = '';
  my $warn;
  $SIG{__WARN__} = sub { $warn .= join ' ', @_; };
  foreach my $value (@data) {
    foreach my $r (@r) {
      $r->recognize($value, $index,
                    sub { $res .= Data::Dumper->Dump([$_[0]],[qw/msg/]) });
    }
    $index++;
  }
  is $res, $res_str, '... got correct result';
  if (defined $warn_str) {
    is $warn, $warn_str, '... got expected failures';
  }
}

done_testing;
